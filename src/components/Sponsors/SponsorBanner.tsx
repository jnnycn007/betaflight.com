import React, { useState, useEffect } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import DOMPurify from 'dompurify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const cycleIntervalMs = 30000; // 10 seconds

export default function SponsorBanner(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<string | null>(null);
  const [counter, setCounter] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const { colorMode } = useColorMode();

  const makeLinksOpenInNewTab = (html: string): string => {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return html;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('a').forEach((anchor) => {
      anchor.setAttribute('target', '_blank');

      const existingRel = anchor.getAttribute('rel');
      const parts = new Set<string>([
        'noopener',
        'noreferrer',
        ...(existingRel ? existingRel.split(' ') : []),
      ]);

      anchor.setAttribute('rel', Array.from(parts).join(' '));
    });

    return doc.body.innerHTML;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPage((prevPage) => {
        const nextPage = (prevPage + 1) % 5;
        setCounter((prevCounter) => prevCounter + 1);
        return nextPage;
      });
    }, cycleIntervalMs / 5);

    return () => clearInterval(interval);
  }, []);

  async function fetchData(mode: string, page: string): Promise<void> {
    const response = await fetch(`https://build.betaflight.com/api/configurator/sponsors/${mode}/${page}`);
    setLoading(true);
    setTimeout(async () => {
      const rawHtml = await response.text();
      const processedHtml = makeLinksOpenInNewTab(rawHtml);
      setData(processedHtml);
      setLoading(false);
    }, 1000);
  }

  useEffect(() => {
    fetchData(colorMode, 'landing');
  }, [colorMode, counter]);

  return (
    <div>
      {data ? (
        <div className={`transition-opacity duration-1000 min-h-[99px] ${loading ? 'opacity-0' : 'opacity-100'}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }} />
      ) : (
        <div className="min-h-[99px] text-2xl flex justify-center items-center">
          <FontAwesomeIcon className="mr-2" icon={faSpinner} spin />
          Loading...
        </div>
      )}
      <div className="flex gap-4 justify-center mt-4">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            className={`transition-all w-4 h-4 rounded-full border ${
              i <= page ? 'bg-gray-500/60 border-transparent' : 'bg-transparent border-gray-500/20'
            }`}
            onClick={() => {
              setPage(i);
              setCounter((prevCounter) => prevCounter + 1);
            }}
          />
        ))}
      </div>
    </div>
  );
}
