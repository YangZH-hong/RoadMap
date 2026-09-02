import { getRoadmapVersion, getIdeas, getBacklog } from '@/lib/notion';
import { RoadmapInteractiveBoard } from '@/components/RoadmapInteractiveBoard';

export const revalidate = 10;

export default async function HomePage() {
  const [versions, ideas, backlog] = await Promise.all([
    getRoadmapVersion().catch(() => []),
    getIdeas().catch(() => []),
    getBacklog().catch(() => []),
  ]);

  return (
    <main className="min-h-screen py-16 px-6 sm:px-10 lg:px-16">
      <div className="max-w-[1600px] mx-auto">
        <RoadmapInteractiveBoard
          initialVersions={versions}
          initialIdeas={ideas}
          initialBacklog={backlog}
        />
      </div>
    </main>
  );
}
