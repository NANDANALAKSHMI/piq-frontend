import { Compass } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg pt-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or was moved."
        action={
          <Button to="/" variant="primary">
            Back to dashboard
          </Button>
        }
      />
    </div>
  );
}
