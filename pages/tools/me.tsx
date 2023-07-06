import { useSession } from 'next-auth/react';
import Layout from '@components/Layout';
import CodeBlock from '@components/CodeBlock';

export default function MePage() {
  const { data } = useSession();

  return (
    <Layout>
      <div className="m-4">
        <CodeBlock language="Json" code={JSON.stringify(data, null, 2)}></CodeBlock>
      </div>
    </Layout>
  );
}
