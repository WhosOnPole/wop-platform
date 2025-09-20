import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuoteCardProps {
  quote: string;
  author: string;
  context?: string; // e.g., "about Lewis Hamilton", "said by Toto Wolff"
  quoteAuthor?: string; // Who said the quote
}

const QuoteCard = ({ quote, author, context, quoteAuthor }: QuoteCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-muted/50 to-accent/20 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Quote className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <blockquote className="text-lg italic font-medium text-foreground leading-relaxed mb-3">
              "{quote}"
            </blockquote>
            <div className="flex flex-col text-sm text-muted-foreground">
              <span className="font-semibold">— {quoteAuthor || author}</span>
              {context && <span className="text-xs mt-1">{context}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;