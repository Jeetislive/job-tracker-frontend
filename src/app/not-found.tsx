import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg text-text-primary">
      <div className="max-w-md text-center">
        <div className="text-[48px] font-bold text-accent mb-2">404</div>
        <h2 className="text-[21px] font-bold mb-2">Page not found</h2>
        <p className="text-[13.5px] text-text-secondary mb-5">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}