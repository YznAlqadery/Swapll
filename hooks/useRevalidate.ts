// hooks/useRevalidateQueries.ts
import { useQueryClient } from "@tanstack/react-query";

export const useRevalidateQueries = () => {
  const queryClient = useQueryClient();

  const revalidate = async (categoryId: number) => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({
      queryKey: ["top-rated-offers", categoryId],
    });
    await queryClient.invalidateQueries({ queryKey: ["recent-offers"] });
    await queryClient.invalidateQueries({
      queryKey: ["offers-by-category", categoryId],
    });
  };

  return { revalidate };
};
