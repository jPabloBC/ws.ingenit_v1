import React, { useState, useRef, useEffect } from "react";
import countries from "world-countries";

export type Country = {
  code: string;
  callingCode: string;
  name: string;
  flag: string;
  currency: string;
};

interface CountryDropdownProps {
  countriesList: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function CountryDropdown({ countriesList, selectedCode, onSelect, dropdownClassName = "", containerClassName = "" }: CountryDropdownProps & { dropdownClassName?: string, containerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = countriesList.find((c: Country) => c.code === selectedCode);
  const filteredCountries = search.length > 0
    ? countriesList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : countriesList;
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
  <div className={`relative w-full ${containerClassName}`} ref={containerRef}>
      <button
        type="button"
        className="flex items-center w-full justify-center bg-transparent py-2 rounded focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        style={{ minHeight: '44px', height: '44px' }}
      >
        <span style={{ fontSize: '1.7rem', marginRight: open ? 8 : 0 }}>{selected?.flag}</span>
        <span className="ml-1 text-sm" style={{ display: open ? 'inline' : 'none' }}>{open ? selected?.name : ''}</span>
        <svg className="ml-1 w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5.25 7.5L10 12.25L14.75 7.5" /></svg>
      </button>
      {open && (
        <div
          className={`absolute bg-white border border-gray-300 rounded shadow-lg ${dropdownClassName}`}
          style={{
            left: '50%',
            top: '50%',
            width: '100%',
            minWidth: '220px',
            maxWidth: '440px',
            maxHeight: '620px',
                       background: 'rgba(255,255,255,0.75)', // 75% transparencia
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            overflowX: 'auto',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                      transform: 'translate(calc(-50% + 45px), -50%)',
            padding: '10px 0',
            position: 'absolute'
          }}
        >
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país..."
            className="w-full px-3 py-2 mb-2 border-b border-gray-200 bg-transparent outline-none text-base"
            autoFocus
          />
          {filteredCountries.length === 0 && (
            <div className="px-4 py-3 text-gray-400 text-center">No se encontró país</div>
          )}
          {filteredCountries.map(c => (
            <button
              key={c.code}
              type="button"
              className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 ${c.code === selectedCode ? 'bg-blue-100' : ''}`}
              style={{ minWidth: '220px', fontSize: '1rem' }}
              onClick={() => { onSelect(c.code); setOpen(false); setSearch(""); }}
            >
              <span style={{ fontSize: '1.3rem', marginRight: 14 }}>{c.flag}</span>
              <span className="text-base" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function getCountriesList() {
  return countries
    .filter(c => c.idd && c.idd.suffixes && c.idd.suffixes.length > 0)
    .map(c => ({
      code: c.cca2,
      callingCode: `${c.idd.root}${c.idd.suffixes[0]}`,
      name: c.name.common,
      flag: c.flag,
      currency: c.currencies ? Object.keys(c.currencies)[0] : "USD"
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
