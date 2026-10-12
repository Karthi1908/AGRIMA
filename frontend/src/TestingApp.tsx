// @ts-nocheck
import React, { useState } from 'react';
import { TermsheetDetails } from './components/TermsheetDetails';
import { RiskAnalyticsPanel } from './components/RiskAnalyticsPanel';
import { ExtractionResponse, SimulationAssumptions, SimulateResponse } from './types';

export const TestingApp = () => {
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);

  const handleExtract = async (file: File): Promise<ExtractionResponse | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Extract failed');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleConfirmed = (result: any) => {
    setExtractionResult(result);
  };

  const handleSimulate = async (assumptions: SimulationAssumptions): Promise<SimulateResponse | null> => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumptions, product_details: extractionResult?.fields || {}, product_type: extractionResult?.product_type || "EQUITY_ACCUMULATOR" })
      });
      if (!res.ok) throw new Error('Simulate failed');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>E2E Test Flow</h1>
      {!extractionResult ? (
        <TermsheetDetails onExtract={handleExtract} onConfirmed={handleConfirmed} />
      ) : (
        <RiskAnalyticsPanel onSimulate={handleSimulate} />
      )}
    </div>
  );
};
