import { useState } from 'react';
import { Send } from 'lucide-react';
import Avatar from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import { Checkbox } from '../../components/common/FormFields.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { timeAgo } from '../../utils/formatters.js';

/** `onAdd(text, { isDecision })` returns a promise resolving to true once saved. */
export default function CommentsPanel({ comments, getMember, onAdd, textareaRef }) {
  const [text, setText] = useState('');
  const [isDecision, setIsDecision] = useState(false);
  const [posting, setPosting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    const saved = await onAdd(text.trim(), { isDecision });
    setPosting(false);
    if (saved) {
      setText('');
      setIsDecision(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Post updates, instructions and decisions for the team here." />
      ) : (
        <ul className="flex flex-col">
          {comments.map((comment) => {
            const author = getMember(comment.authorId);
            const name = comment.authorName || author?.name || 'Unknown';
            return (
              <li key={comment.id} className="flex gap-3 border-b border-line py-3 first:pt-0 last:border-0">
                <Avatar name={name} color={author?.color} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {name}{' '}
                    <span className="text-[12.5px] font-normal text-muted">
                      {comment.role && `· ${comment.role} `}· {timeAgo(comment.at)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-line">{comment.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2.5">
        <label htmlFor="project-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="project-comment"
          ref={textareaRef}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an update, instruction or decision…"
          className="w-full resize-y rounded-[10px] border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox label="Mark as key decision" checked={isDecision} onChange={(e) => setIsDecision(e.target.checked)} />
          <Button type="submit" variant="primary" size="sm" icon={Send} disabled={!text.trim() || posting}>
            {posting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
