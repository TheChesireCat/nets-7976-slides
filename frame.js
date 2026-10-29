// Wrap each content slide into header / stage / footer (styled in lecture.css), so space is shared by a flex
// column instead of fixed positions. Leaves covers, stacks and speaker notes alone.
// Used by the lecture decks (week-04 on) and by the phone reader (read.html).
function wrapFrames(root) {
  root.querySelectorAll('.reveal .slides section').forEach(slide => {
    if (slide.querySelector(':scope > section') || slide.classList.contains('cover')) return;
    if (!slide.querySelector(':scope > h2')) return;
    if (slide.classList.contains('framed')) return;                            // already wrapped
    const frame = document.createElement('div'); frame.className = 'frame';
    const header = document.createElement('header');
    const stage = document.createElement('div'); stage.className = 'stage';
    const footer = document.createElement('footer');
    [...slide.childNodes].forEach(node => {
      if (node.nodeType === 3 && !node.textContent.trim()) return;            // whitespace
      if (node.nodeType === 1 && node.matches('aside.notes')) return;          // notes stay put
      if (node.nodeType === 1 && node.matches('p.eyebrow, h2')) header.appendChild(node);
      else if (node.nodeType === 1 && node.matches('p.gloss, p.footnote')) footer.appendChild(node);
      else if (node.nodeType === 1) stage.appendChild(node);
    });
    frame.append(header, stage);
    if (footer.childNodes.length) frame.append(footer);
    slide.prepend(frame);
    slide.classList.add('framed');
  });
}
