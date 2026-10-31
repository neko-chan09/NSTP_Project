// src/hooks/useOptions.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../services/api";

export const OPTIONS_KEYS = {
    COURSES: ["options", "courses"],
    SECTIONS: ["options", "sections"],
    YEAR_LEVELS: ["options", "year-levels"],
    COMPONENTS: ["options", "components"],
};

export function useCourses() {
    const queryClient = useQueryClient();
    
    const query = useQuery({
        queryKey: OPTIONS_KEYS.COURSES,
        queryFn: () => adminApi.getCourses(),
        staleTime: 3600000, // 1 hour
        placeholderData: [],
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: OPTIONS_KEYS.COURSES });
    };

    return { ...query, refresh };
}

export function useSections() {
    const queryClient = useQueryClient();
    
    const query = useQuery({
        queryKey: OPTIONS_KEYS.SECTIONS,
        queryFn: () => adminApi.getSections(),
        staleTime: 3600000, // 1 hour
        placeholderData: [],
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: OPTIONS_KEYS.SECTIONS });
    };

    return { ...query, refresh };
}

export function useYearLevels() {
    const queryClient = useQueryClient();
    
    const query = useQuery({
        queryKey: OPTIONS_KEYS.YEAR_LEVELS,
        queryFn: () => adminApi.getYearLevels(),
        staleTime: 3600000, // 1 hour
        placeholderData: [],
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: OPTIONS_KEYS.YEAR_LEVELS });
    };

    return { ...query, refresh };
}

export function useComponents() {
    const queryClient = useQueryClient();
    
    const query = useQuery({
        queryKey: OPTIONS_KEYS.COMPONENTS,
        queryFn: () => adminApi.getComponents(),
        staleTime: 3600000, // 1 hour
        placeholderData: [],
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: OPTIONS_KEYS.COMPONENTS });
    };

    return { ...query, refresh };
}