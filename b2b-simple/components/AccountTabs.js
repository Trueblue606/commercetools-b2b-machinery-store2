export default function AccountTabs(){
  const link = {marginRight:12,fontSize:14};
  return (
    <div style={{margin:'8px 0 16px'}}>
      <a href="/account" style={link}>Overview</a>
      <a href="/account/orders/123" style={link}>Orders</a>
      <a href="/order-success" style={link}>Order Success</a>
    </div>
  );
}
