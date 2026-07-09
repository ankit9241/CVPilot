export interface VaultItemDomain {
  company: string;
  logo: string;
  roles: Array<{
    role: string;
    versions: Array<{
      id: string;
      name: string;
      ats: number;
      template: string;
      date: string;
      favorite: boolean;
    }>;
  }>;
}
