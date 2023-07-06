import Image from 'next/image';
import CodeBlock from '@components/CodeBlock';
import Layout from '@components/Layout';
import gifSrc from '@public/media/select-ad-acc.gif';

export default function ScriptPage() {
  const code =
    '(()=>{const a=Array.from(document.querySelectorAll(".ant-dropdown .rc-checkbox-input")),b=prompt("Enter the part you want to select: start, end",`1,${a.length}`).split(",").map(c=>Number(c.trim()));if(!isNaN(b[0])&&!isNaN(b[1]))for(const c of a.slice(Math.max(b[0]-1,0),Math.min(b[1],a.length)))c&&c.click()})();';

  return (
    <Layout>
      <div className="m-4">
        <div className="grid grid-cols-7 gap-4">
          <div className="flex flex-col gap-4 p-4 col-span-3">
            <h1 className="text-xl font-semibold">1. Script to select all ad accounts while cloning the creative.</h1>
            <ul className="steps steps-sm steps-vertical">
              <li className="step">Copy the above code</li>
              <li className="step">Navigate to Creative Library</li>
              <li className="step">{`Open the developer console (F12)`}</li>
              <li className="step">Select the creative to clone</li>
              <li className="step">{`Click to "Copy To" button`}</li>
              <li className="step">Parse copied code to console tab</li>
              <li className="step">Press Enter.</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 col-span-4">
            <CodeBlock language="Javascript" code={code} />
            <Image src={gifSrc} className="w-full" alt="select-all-ad-ac" unoptimized />
          </div>
        </div>
      </div>
    </Layout>
  );
}
