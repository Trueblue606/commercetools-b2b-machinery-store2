export async function getServerSideProps() {
  console.log('SSR PAGE HIT', { hasEnv: !!process.env.CT_PROJECT_KEY });
  return { props: { ts: Date.now(), hasEnv: !!process.env.CT_PROJECT_KEY } };
}
export default function Page({ ts, hasEnv }) {
  return <pre>SSR OK {ts} env:{String(hasEnv)}</pre>;
}
