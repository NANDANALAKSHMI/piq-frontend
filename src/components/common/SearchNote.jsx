/** Small line under a search box when server search (Algolia) failed and the page fell back to browser search. */
export default function SearchNote({ error }) {
  if (!error) return null;
  return (
    <p role="status" className="text-[12.5px] text-amber-800">
      Server search is unavailable ({error}) — showing results filtered in the browser.
    </p>
  );
}
