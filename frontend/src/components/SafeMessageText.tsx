import { Fragment } from 'react';

interface SafeMessageTextProps {
  text: string;
  strongClassName?: string;
}

/**
 * Renders the app's minimal **bold** convention without HTML injection.
 * User-created intake responses are therefore displayed as plain text rather
 * than being interpreted as markup by the browser.
 */
export default function SafeMessageText({ text, strongClassName = 'font-semibold text-white' }: SafeMessageTextProps) {
  return (
    <div className="whitespace-pre-wrap break-words">
      {text.split('\n').map((line, lineIndex) => (
        <Fragment key={`${line}-${lineIndex}`}>
          {line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
            const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
            return isBold
              ? <strong key={`${part}-${partIndex}`} className={strongClassName}>{part.slice(2, -2)}</strong>
              : <Fragment key={`${part}-${partIndex}`}>{part}</Fragment>;
          })}
          {lineIndex < text.split('\n').length - 1 && <br />}
        </Fragment>
      ))}
    </div>
  );
}
