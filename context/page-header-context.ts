import { createContext, useContext } from "react";

export type PageHeaderContextType = {
  title: string;
  description: string;
  tourName: string | null;
  setPageHeader: (title: string, description: string, tourName?: string | null) => void;
};

export const defaultPageHeader: PageHeaderContextType = {
  title: "Gestión de Usuarios",
  description:
    "Administre usuarios, registre nuevos clientes y actualice información.",
  tourName: null,
  setPageHeader: () => {},
};

export const PageHeaderContext =
  createContext<PageHeaderContextType>(defaultPageHeader);

export const usePageHeader = () => {
  return useContext(PageHeaderContext);
};
