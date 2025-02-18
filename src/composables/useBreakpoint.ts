import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);

export const getBreakpointValue = (value: string): number =>
  +fullConfig.theme.screens[value].slice(
    0,
    fullConfig.theme.screens[value].indexOf('px')
  );

export const getCurrentBreakpoint = (): string => {
  let currentBreakpoint = "sm";
  let biggestBreakpointValue = 0;
  for (const breakpoint of Object.keys(fullConfig.theme.screens)) {
    const breakpointValue = getBreakpointValue(breakpoint);

    //test
    //console.log(breakpoint, breakpointValue, window.screen.width);

    if (
      breakpointValue > biggestBreakpointValue &&
      window.screen.width >= breakpointValue
    ) {
      biggestBreakpointValue = breakpointValue;
      currentBreakpoint = breakpoint;
    }
  }
  return currentBreakpoint;
};