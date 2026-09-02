import { VersionStatus } from '@/types/roadmap';

interface StatusBadgeProps {
  status: VersionStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  if (normalized === 'released') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#e8f0e8] text-[#4a7c5f] border border-[#c4d9c4]">
        已发布
      </span>
    );
  }
  if (normalized === 'in progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#e8edf0] text-[#5a7a8b] border border-[#c4d0d8]">
        进行中
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#f0ebe6] text-[#8b7355] border border-[#ddd0c2]">
      规划中
    </span>
  );
}
