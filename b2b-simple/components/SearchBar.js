export default function SearchBar(){
  function onSubmit(e){
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q');
    if(typeof window !== 'undefined') window.location.href='/?q='+encodeURIComponent(q||'');
  }
  return (
    <form onSubmit={onSubmit} style={{display:'flex',gap:8,margin:'8px 0 16px'}}>
      <input name="q" placeholder="Search..." style={{flex:1,padding:'8px',border:'1px solid #ddd',borderRadius:6}}/>
      <button style={{padding:'8px 12px',border:'1px solid #ddd',borderRadius:6,background:'#f7f7f7'}}>Search</button>
    </form>
  );
}
