export default function FiltersSidebar(){
  return (
    <aside style={{border:'1px solid #eee',padding:12,borderRadius:8}}>
      <strong>Filters</strong>
      <div><label><input type="checkbox"/> In stock</label></div>
      <div><label><input type="checkbox"/> Contract only</label></div>
    </aside>
  );
}
