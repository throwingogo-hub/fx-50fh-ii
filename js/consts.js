// consts.js — the 40 built-in scientific constants, in the ten-page menu order
// printed in the user's guide (2010 CODATA recommended values,
// which is the revision this calculator ships: on the unit mp reads
// 1.672621777e-27 where the older manual has 1.67262171e-27).

export const CONSTANTS = [
  { key: 'mp', sym: 'mp', v: 1.672621777e-27, unit: 'kg' },
  { key: 'mn', sym: 'mn', v: 1.674927351e-27, unit: 'kg' },
  { key: 'me', sym: 'me', v: 9.10938291e-31, unit: 'kg' },
  { key: 'mmu', sym: 'mμ', v: 1.883531475e-28, unit: 'kg' },

  { key: 'a0', sym: 'a0', v: 5.2917721092e-11, unit: 'm' },
  { key: 'h', sym: 'h', v: 6.62606957e-34, unit: 'J s' },
  { key: 'muN', sym: 'μN', v: 5.05078353e-27, unit: 'J T⁻¹' },
  { key: 'muB', sym: 'μB', v: 9.27400968e-24, unit: 'J T⁻¹' },

  { key: 'hbar', sym: 'ħ', v: 1.054571726e-34, unit: 'J s' },
  { key: 'alpha', sym: 'α', v: 0.0072973525698, unit: '' },
  { key: 're', sym: 're', v: 2.8179403267e-15, unit: 'm' },
  { key: 'lc', sym: 'λc', v: 2.4263102389e-12, unit: 'm' },

  { key: 'gp', sym: 'γp', v: 267522200.5, unit: 's⁻¹ T⁻¹' },
  { key: 'lcp', sym: 'λcp', v: 1.32140985623e-15, unit: 'm' },
  { key: 'lcn', sym: 'λcn', v: 1.3195909068e-15, unit: 'm' },
  { key: 'Rinf', sym: 'R∞', v: 10973731.568539, unit: 'm⁻¹' },

  { key: 'u', sym: 'u', v: 1.660538921e-27, unit: 'kg' },
  { key: 'mup', sym: 'μp', v: 1.410606743e-26, unit: 'J T⁻¹' },
  { key: 'mue', sym: 'μe', v: -9.2847643e-24, unit: 'J T⁻¹' },
  { key: 'mun', sym: 'μn', v: -9.6623647e-27, unit: 'J T⁻¹' },

  { key: 'mumu', sym: 'μμ', v: -4.49044807e-26, unit: 'J T⁻¹' },
  { key: 'F', sym: 'F', v: 96485.3365, unit: 'C mol⁻¹' },
  { key: 'eq', sym: 'e', v: 1.602176565e-19, unit: 'C' },
  { key: 'NA', sym: 'NA', v: 6.02214129e+23, unit: 'mol⁻¹' },

  { key: 'k', sym: 'k', v: 1.3806488e-23, unit: 'J K⁻¹' },
  { key: 'Vm', sym: 'Vm', v: 0.022413968, unit: 'm³ mol⁻¹' },
  { key: 'R', sym: 'R', v: 8.3144621, unit: 'J mol⁻¹ K⁻¹' },
  { key: 'C0', sym: 'C0', v: 299792458, unit: 'm s⁻¹' },

  { key: 'C1', sym: 'C1', v: 3.74177153e-16, unit: 'W m²' },
  { key: 'C2', sym: 'C2', v: 0.01438777, unit: 'm K' },
  { key: 'sigma', sym: 'σ', v: 5.670373e-08, unit: 'W m⁻² K⁻⁴' },
  { key: 'eps0', sym: 'ε0', v: 8.854187817e-12, unit: 'F m⁻¹' },

  { key: 'mu0', sym: 'μ0', v: 1.2566370614e-06, unit: 'N A⁻²' },
  { key: 'phi0', sym: 'φ0', v: 2.067833758e-15, unit: 'Wb' },
  { key: 'g', sym: 'g', v: 9.80665, unit: 'm s⁻²' },
  { key: 'G0', sym: 'G0', v: 7.7480917346e-05, unit: 'S' },

  { key: 'Z0', sym: 'Z0', v: 376.730313461, unit: 'Ω' },
  { key: 'tK', sym: 't', v: 273.15, unit: 'K' },
  { key: 'G', sym: 'G', v: 6.67384e-11, unit: 'm³ kg⁻¹ s⁻²' },
  { key: 'atm', sym: 'atm', v: 101325, unit: 'Pa' }
];

export const CONST_BY_KEY = Object.fromEntries(CONSTANTS.map((c) => [c.key, c]));

/** Ten menu pages of four entries each. */
export const CONST_PAGES = Array.from({ length: 10 }, (_, i) =>
  CONSTANTS.slice(i * 4, i * 4 + 4));
