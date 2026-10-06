

export default function TagSelector({ tags, selectedIds = [], onToggle }) {
  const isSelected = (id) => selectedIds.includes(id);

  const handleClick = (id) => {
    onToggle(id);
  };

  return (
    <div className="tag-selector">
      {tags.map((tag) => {
        const selected = isSelected(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            className={`tag-chip ${selected ? 'tag-chip--selected' : ''}`}
            onClick={() => handleClick(tag.id)}
          >
            <span>{tag.name}</span>
          </button>
        );
      })}
    </div>
  );
}
