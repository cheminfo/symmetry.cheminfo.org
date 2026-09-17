/**
 * What this site says about itself, as the record the shared About page draws.
 *
 * Content only: the page, its sections and their order belong to
 * `react-cheminfo`, so a reader who has seen one About of the family knows
 * where the credits are on this one.
 */

import { BUILD_INFO } from 'react-cheminfo/build-info';
import type { AboutContent } from 'react-cheminfo/core';
import { PLATFORM_WORK, TEACHING_WORK } from 'react-cheminfo/core';

/** The record `/about` renders. */
export const ABOUT: AboutContent = {
  siteId: 'symmetry',
  // Which release, built when, from which commit: the build says so,
  // because a version written by hand is wrong by the next release.
  build: BUILD_INFO,
  what: 'Assign the point group of a molecule, build a crystal from its space group, and name the symmetry of a pattern.',
  can: [
    'Assign the point group of any molecule, one flowchart question at a time.',
    'Watch every symmetry operation act on the structure in 3D.',
    'Read a character table, reduce a representation, predict the infrared bands.',
    'Build a cell in any of the 230 space groups and export it as CIF.',
    'Name the 17 wallpaper groups and the 7 frieze groups from the pattern.',
    'Work through checked exercises, and print the cheatsheet.',
  ],
  paragraphs: [
    'Symmetry is the shortest route to a spectrum. The point group decides which vibrations absorb infrared, which are Raman active, and whether the molecule can be chiral or polar at all. Add translation to the same argument and you get the 230 space groups, which is why a crystallographer reads the symbol of a structure before looking at its atoms.',
    'Everything runs in the page. The space-group settings come from the International Tables, the point group of a molecule is detected from its coordinates, and nothing you build is sent anywhere.',
  ],
  people: [{ name: 'Luc Patiny' }],
  providedBy: ['epfl'],
  credits: [
    'molstar',
    'blueprint',
    'react',
    'vite',
    'ml-matrix',
    'react-mf',
    'ml-xsadd',
    'cif-to-json',
    'react-cheminfo',
    'cheminfo-font',
  ],
  cite: [PLATFORM_WORK, TEACHING_WORK],
};
