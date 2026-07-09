import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

export function useFeatureFlag(flagKey: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', flagKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('key', flagKey)
        .single();

      if (error) {
        console.warn(`Feature flag "${flagKey}" not found, defaulting to false`);
        return false;
      }

      return data?.is_enabled ?? false;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return { isEnabled: data ?? false, isLoading };
}
