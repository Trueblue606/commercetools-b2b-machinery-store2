export default function Navbar() {
  const s = {
    bar:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid #eee',position:'sticky',top:0,background:'#fff',zIndex:10},
    left:{display:'flex',gap:'16px',alignItems:'center'},
    right:{display:'flex',gap:'12px',alignItems:'center'},
    logo:{fontWeight:700,letterSpacing:'0.2px'},
    link:{textDecoration:'none',color:'#111',fontSize:14},
    btn:{padding:'6px 10px',border:'1px solid #ddd',borderRadius:6,background:'#f7f7f7',cursor:'pointer',fontSize:14}
  };
  return (
    <nav style={s.bar}>
      <div style={s.left}>
        <a href="/" style={{...s.link,...s.logo}}>Chemo Pilot</a>
        <a href="/" style={s.link}>Products</a>
        <a href="/price-test" style={s.link}>Price Test</a>
      </div>
      <div style={s.right}>
        <a href="/login" style={s.link}>Login</a>
        <a href="/account" style={s.link}>Account</a>
        <a href="/cart" style={s.btn}>🛒 Cart</a>
      </div>
    </nav>
  );
}
