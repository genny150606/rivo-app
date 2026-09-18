// ============================================================================
// RIVO AI WINE PAIRING & SOMMELIER ENGINE
// Instant wine recommendations and pairing rationale
// ============================================================================

export interface WinePairingData {
  name: string;
  type: 'Rosso' | 'Bianco' | 'Bollicine' | 'Rosato' | 'Passito';
  region: string;
  tastingNotes: string;
  whyItWorks: string;
  priceEstimate: string;
}

export async function fetchWinePairing(
  dishName: string,
  dishDescription?: string,
  orgId?: string
): Promise<{ reply: string; winePairing: WinePairingData }> {
  try {
    const res = await fetch('/api/ai/sommelier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dishName,
        dishDescription,
        organization_id: orgId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.winePairing) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Error fetching wine pairing:', err);
  }

  // Client-side fallback
  const d = dishName.toLowerCase();
  if (d.includes('pesce') || d.includes('vongol') || d.includes('spigola') || d.includes('mare')) {
    return {
      reply: `Per ${dishName}, ti consigliamo un Greco di Tufo DOCG fresco e minerale.`,
      winePairing: {
        name: 'Greco di Tufo DOCG',
        type: 'Bianco',
        region: 'Campania',
        tastingNotes: 'Sentori agrumati, zagara e sapidità minerale viva.',
        whyItWorks: 'Esprime una mineralità vulcanica pura che valorizza la freschezza e la delicatezza del pesce.',
        priceEstimate: '24,00 €',
      },
    };
  }

  if (d.includes('pizza') || d.includes('burrata') || d.includes('margherita')) {
    return {
      reply: `Per ${dishName}, l'ideale è una bollicina Franciacorta Brut DOCG.`,
      winePairing: {
        name: 'Franciacorta Brut DOCG',
        type: 'Bollicine',
        region: 'Lombardia',
        tastingNotes: 'Perlage finissimo, note di crosta di pane dorata e frutta a polpa bianca.',
        whyItWorks: 'Pulisce la bocca dalla ricchezza dei formaggi ed esalta la fragranza del cornicione cotto a legna.',
        priceEstimate: '32,00 €',
      },
    };
  }

  if (d.includes('dolce') || d.includes('tiramis') || d.includes('cioccolato')) {
    return {
      reply: `Per ${dishName}, consigliamo un Moscato d'Asti DOCG aromatico.`,
      winePairing: {
        name: 'Moscato d\'Asti DOCG',
        type: 'Passito',
        region: 'Piemonte',
        tastingNotes: 'Dolce, vellutato con fragranza di salvia e pesca sciroppata.',
        whyItWorks: 'Accompagna armoniosamente la dolcezza senza risultare stucchevole.',
        priceEstimate: '20,00 €',
      },
    };
  }

  return {
    reply: `Per ${dishName}, ti consigliamo un Chianti Classico DOCG Riserva.`,
    winePairing: {
      name: 'Chianti Classico DOCG Riserva',
      type: 'Rosso',
      region: 'Toscana',
      tastingNotes: 'Ciliegia matura, note tostate e tannini nobili.',
      whyItWorks: 'Struttura impeccabile capace di esaltare cotture su brace e sughi della tradizione.',
      priceEstimate: '28,00 €',
    },
  };
}
