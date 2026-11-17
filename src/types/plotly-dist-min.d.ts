declare module 'plotly.js-dist-min' {
  import type { Config, Data, Layout, PlotlyHTMLElement } from 'plotly.js';

  const PlotlyDist: {
    react: (
      root: HTMLElement | string,
      data: Data[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ) => Promise<PlotlyHTMLElement>;
    purge: (root: HTMLElement | string) => void;
    Plots: {
      resize: (root: HTMLElement | string) => Promise<PlotlyHTMLElement>;
    };
  };

  export default PlotlyDist;
}
