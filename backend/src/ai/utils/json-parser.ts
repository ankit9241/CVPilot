// Robust JSON parser with error handling and automatic recovery

function cleanMarkdownJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  // ponytail: strip reasoning preamble — thinking models (gemini-2.5-flash etc.)
  // can leak chain-of-thought text before the JSON object/array.
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const start =
      firstBrace === -1 ? firstBracket
      : firstBracket === -1 ? firstBrace
      : Math.min(firstBrace, firstBracket);
    if (start > 0) cleaned = cleaned.substring(start);
  }
  return cleaned.trim();
}

function escapeControlCharsInJSON(jsonString: string): string {
  let inString = false;
  let escapeNext = false;
  let result = '';

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      if (inString) {
        escapeNext = true;
      }
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

function stripComments(jsonString: string): string {
  let inString = false;
  let escapeNext = false;
  let result = '';

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      if (inString) {
        escapeNext = true;
      }
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (!inString) {
      // Check for single-line comment
      if (char === '/' && jsonString[i + 1] === '/') {
        // Skip until newline
        while (i < jsonString.length && jsonString[i] !== '\n') {
          i++;
        }
        // Add the newline to preserve line numbers if needed
        result += '\n';
        continue;
      }
      // Check for multi-line comment
      if (char === '/' && jsonString[i + 1] === '*') {
        i += 2;
        while (i < jsonString.length && !(jsonString[i] === '*' && jsonString[i + 1] === '/')) {
          i++;
        }
        i++; // skip '/'
        continue;
      }
    }

    result += char;
  }

  return result;
}

function cleanJSONString(text: string): string {
  let cleaned = cleanMarkdownJson(text);
  cleaned = escapeControlCharsInJSON(cleaned);
  cleaned = stripComments(cleaned);
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Collapse excessive runs of escaped newlines (\n\n\n...) inside string values.
  // Models sometimes pad string values with many newlines to fill token budget.
  // Replace 3+ consecutive escaped newlines with a single space.
  cleaned = cleaned.replace(/(\\n){3,}/g, ' ');
  return cleaned;
}

function repairJSONString(text: string): string {
  // Attempt to escape raw illegal control characters in string values (newlines, tabs)
  return text.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, p1) => {
    const escaped = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    return `"${escaped}"`;
  });
}

function extractAndMergeJSON(text: string): any {
  const objects: any[] = [];
  let braceCount = 0;
  let startIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0) {
          startIdx = i;
        }
        braceCount++;
      } else if (char === '}') {
        if (braceCount > 0) {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            const candidate = text.substring(startIdx, i + 1);
            try {
              const cleanedCandidate = cleanJSONString(candidate);
              const parsed = JSON.parse(cleanedCandidate);
              if (parsed && typeof parsed === 'object') {
                objects.push(parsed);
              }
            } catch {
              try {
                const repaired = repairJSONString(cleanJSONString(candidate));
                const parsed = JSON.parse(repaired);
                if (parsed && typeof parsed === 'object') {
                  objects.push(parsed);
                }
              } catch {
                // Ignore invalid brace-matched segments
              }
            }
            startIdx = -1;
          }
        }
      }
    }
  }

  if (objects.length === 0) {
    throw new Error('No valid JSON objects found');
  }

  // Merge all objects
  let merged: any = {};
  for (const obj of objects) {
    merged = { ...merged, ...obj };
  }

  return merged;
}

/**
 * Recursively trims all string values in a parsed object/array.
 * Handles the case where the model pads string values with whitespace/newlines.
 */
export function trimStringValues<T>(value: T): T {
  if (typeof value === 'string') {
    return value.trim().replace(/\s{3,}/g, ' ') as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(trimStringValues) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      result[k] = trimStringValues(v);
    }
    return result as T;
  }
  return value;
}

export function parseJSON<T>(text: string): T {
  const cleaned = cleanJSONString(text);

  // 1. Try standard parsing first
  try {
    return trimStringValues(JSON.parse(cleaned) as T);
  } catch (firstError) {
    // 2. Try parsing after repairing control characters
    try {
      const repaired = repairJSONString(cleaned);
      return trimStringValues(JSON.parse(repaired) as T);
    } catch {
      // 3. Fall back to balanced brace scanning and merging multiple JSON objects
      try {
        const merged = extractAndMergeJSON(text);
        if (Object.keys(merged).length > 0) {
          return trimStringValues(merged as T);
        }
      } catch (mergeError) {
        // Log the failure details to console to aid debugging
        console.error('Failed to parse JSON from LLM. Raw content was:', text);
        try {
          const fs = require('fs');
          fs.writeFileSync('temp-failed-json.txt', text, 'utf8');
        } catch (e) {
          console.error('Failed to write temp-failed-json.txt:', e);
        }
      }

      throw new Error(
        `Failed to parse JSON: ${firstError instanceof Error ? firstError.message : String(firstError)}`,
      );
    }
  }
}

// Safe JSON parse with fallback
export function parseJSONSafe<T>(text: string, fallback: T): T {
  try {
    return parseJSON<T>(text);
  } catch {
    return fallback;
  }
}
