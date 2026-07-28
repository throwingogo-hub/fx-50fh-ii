// consts.js — the 40 built-in scientific constants, in the ten-page menu order
// printed in the user's guide (2000 CODATA recommended values).

export const CONSTANTS = [
  { key: 'mp', sym: 'mp', v: 1.67262171e-27, unit: 'kg' },
  { key: 'mn', sym: 'mn', v: 1.67492728e-27, unit: 'kg' },
  { key: 'me', sym: 'me', v: 9.1093826e-31, unit: 'kg' },
  { key: 'mmu', sym: 'mμ', v: 1.8835314e-28, unit: 'kg' },

  { key: 'a0', sym: 'a0', v: 0.5291772108e-10, unit: 'm' },
  { key: 'h', sym: 'h', v: 6.6260693e-34, unit: 'J s' },
  { key: 'muN', sym: 'μN', v: 5.05078343e-27, unit: 'J T⁻¹' },
  { key: 'muB', sym: 'μB', v: 927.400949e-26, unit: 'J T⁻¹' },

  { key: 'hbar', sym: 'ħ', v: 1.05457168e-34, unit: 'J s' },
  { key: 'alpha', sym: 'α', v: 7.297352568e-3, unit: '' },
  { key: 're', sym: 're', v: 2.817940325e-15, unit: 'm' },
  { key: 'lc', sym: 'λc', v: 2.426310238e-12, unit: 'm' },

  { key: 'gp', sym: 'γp', v: 2.67522205e8, unit: 's⁻¹ T⁻¹' },
  { key: 'lcp', sym: 'λcp', v: 1.3214098555e-15, unit: 'm' },
  { key: 'lcn', sym: 'λcn', v: 1.3195909067e-15, unit: 'm' },
  { key: 'Rinf', sym: 'R∞', v: 10973731.568525, unit: 'm⁻¹' },

  { key: 'u', sym: 'u', v: 1.66053886e-27, unit: 'kg' },
  { key: 'mup', sym: 'μp', v: 1.41060671e-26, unit: 'J T⁻¹' },
  { key: 'mue', sym: 'μe', v: -928.476412e-26, unit: 'J T⁻¹' },
  { key: 'mun', sym: 'μn', v: -0.96623645e-26, unit: 'J T⁻¹' },

  { key: 'mumu', sym: 'μμ', v: -4.49044799e-26, unit: 'J T⁻¹' },
  { key: 'F', sym: 'F', v: 96485.3383, unit: 'C mol⁻¹' },
  { key: 'eq', sym: 'e', v: 1.60217653e-19, unit: 'C' },
  { key: 'NA', sym: 'NA', v: 6.0221415e23, unit: 'mol⁻¹' },

  { key: 'k', sym: 'k', v: 1.3806505e-23, unit: 'J K⁻¹' },
  { key: 'Vm', sym: 'Vm', v: 22.413996e-3, unit: 'm³ mol⁻¹' },
  { key: 'R', sym: 'R', v: 8.314472, unit: 'J mol⁻¹ K⁻¹' },
  { key: 'C0', sym: 'C0', v: 299792458, unit: 'm s⁻¹' },

  { key: 'C1', sym: 'C1', v: 3.74177138e-16, unit: 'W m²' },
  { key: 'C2', sym: 'C2', v: 1.4387752e-2, unit: 'm K' },
  { key: 'sigma', sym: 'σ', v: 5.670400e-8, unit: 'W m⁻² K⁻⁴' },
  { key: 'eps0', sym: 'ε0', v: 8.854187817e-12, unit: 'F m⁻¹' },

  { key: 'mu0', sym: 'μ0', v: 12.566370614e-7, unit: 'N A⁻²' },
  { key: 'phi0', sym: 'φ0', v: 2.06783372e-15, unit: 'Wb' },
  { key: 'g', sym: 'g', v: 9.80665, unit: 'm s⁻²' },
  { key: 'G0', sym: 'G0', v: 7.748091733e-5, unit: 'S' },

  { key: 'Z0', sym: 'Z0', v: 376.730313461, unit: 'Ω' },
  { key: 'tK', sym: 't', v: 273.15, unit: 'K' },
  { key: 'G', sym: 'G', v: 6.6742e-11, unit: 'm³ kg⁻¹ s⁻²' },
  { key: 'atm', sym: 'atm', v: 101325, unit: 'Pa' }
];

export const CONST_BY_KEY = Object.fromEntries(CONSTANTS.map((c) => [c.key, c]));

/** Ten menu pages of four entries each. */
export const CONST_PAGES = Array.from({ length: 10 }, (_, i) =>
  CONSTANTS.slice(i * 4, i * 4 + 4));
