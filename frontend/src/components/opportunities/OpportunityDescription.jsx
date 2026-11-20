function isListBlock(lines) {
  return lines.every((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line));
}

function stripListMarker(line) {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
}

export function OpportunityDescription({ description = "" }) {
  const blocks = String(description)
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return (
      <p className="font-body text-sm leading-6 text-[#8C8496]">
        Opportunity details will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const lines = block.split(/\r?\n/).filter((line) => line.trim());
        const isOrderedList = lines.every((line) =>
          /^\s*\d+[.)]\s+/.test(line)
        );

        if (isListBlock(lines)) {
          const List = isOrderedList ? "ol" : "ul";
          return (
            <List
              key={`list-${index}`}
              className={`space-y-2 pl-5 font-body text-sm leading-6 text-[#5B5265] ${
                isOrderedList ? "list-decimal" : "list-disc"
              }`}
            >
              {lines.map((line, lineIndex) => (
                <li key={`item-${lineIndex}`}>{stripListMarker(line)}</li>
              ))}
            </List>
          );
        }

        const headingMatch = lines[0].match(/^(.{1,80}):$/);
        const paragraphLines = headingMatch ? lines.slice(1) : lines;

        return (
          <section key={`paragraph-${index}`}>
            {headingMatch && (
              <h3 className="font-nav text-xs font-semibold uppercase tracking-[0.12em] text-[#44318D]">
                {headingMatch[1]}
              </h3>
            )}
            {paragraphLines.length > 0 && (
              <p
                className={`whitespace-pre-line font-body text-sm leading-7 text-[#5B5265] ${
                  headingMatch ? "mt-2" : ""
                }`}
              >
                {paragraphLines.join("\n")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
