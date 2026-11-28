import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Pin, Send } from 'lucide-react';
import Avatar from '../../components/common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn, timeAgo } from '../../utils/formatters.js';

/** Chat-style team thread. `onAdd(text, { isDecision })` returns a promise resolving to true once saved. */
export default function CommentsPanel({ comments, getMember, onAdd, textareaRef, className = 'h-[34rem]' }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isDecision, setIsDecision] = useState(false);
  const [posting, setPosting] = useState(false);
  const endRef = useRef(null);

  // Newest message in view whenever the thread changes.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [comments.length]);

  const submit = async (event) => {
    event?.preventDefault();
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
    <div className={cn('flex flex-col', className)}>
      <div className="scrollbar-thin -mx-1 flex-1 overflow-y-auto px-1">
        {comments.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="flex flex-col items-center gap-2 text-muted">
              <MessageSquare className="size-8" aria-hidden="true" />
              <p className="text-[13px]">No messages yet. Post an update, instruction or decision for the team.</p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3.5 py-1">
            {comments.map((comment) => {
              const author = getMember(comment.authorId);
              const name = comment.authorName || author?.name || 'Unknown';
              const mine = Boolean(user) && comment.authorId === user.id;
              return (
                <li key={comment.id} className={cn('flex items-end gap-2.5', mine && 'flex-row-reverse')}>
                  <Avatar name={name} color={author?.color} size="sm" />
                  <div className={cn('flex min-w-0 max-w-[82%] flex-col gap-1', mine && 'items-end')}>
                    <p className="px-1 text-xs text-muted">
                      <span className="font-semibold text-ink">{mine ? 'You' : name}</span>
                      {comment.role && ` · ${comment.role}`} · {timeAgo(comment.at)}
                    </p>
                    <p
                      className={cn(
                        'whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm',
                        mine ? 'rounded-br-md bg-navy text-white dark:bg-navy-3' : 'rounded-bl-md border border-line bg-field',
                      )}
                    >
                      {comment.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t border-line pt-3">
        <label htmlFor="project-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="project-comment"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          placeholder="Write a message…"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-[10px] border border-line bg-field px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setIsDecision((on) => !on)}
          aria-pressed={isDecision}
          title="Pin as key decision"
          aria-label="Pin as key decision"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-[10px] border transition-colors',
            isDecision ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-field text-muted hover:text-ink',
          )}
        >
          <Pin className="size-4" aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || posting}
          aria-label="Send message"
          className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-brand text-white transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
