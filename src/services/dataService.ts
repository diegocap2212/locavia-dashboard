export interface JiraItem {
  Type: string;
  Key: string;
  Summary: string | unknown;
  Status: string;
  Team: string;
  Created: string;
  Resolved: string | null;
  Release: string;
  [key: string]: unknown;
}

const CLOUD_DATA_URL = import.meta.env.VITE_CLOUD_DATA_URL;

export const fetchData = async (): Promise<JiraItem[]> => {
  if (!CLOUD_DATA_URL || CLOUD_DATA_URL.includes("your-id")) {
    console.warn("VITE_CLOUD_DATA_URL is not configured properly. Falling back to internal data.");
    // We could return a local fallback here or throw an error.
    // For now, let's try to fetch and if it fails, the caller (App.tsx) can handle it.
  }

  try {
    const response = await fetch(CLOUD_DATA_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch cloud data: ${response.statusText}`);
    }

    // Google Sheets JSON output (via gviz/tq) is wrapped in a callback.
    // If it's pure CSV or JSON, handled differently.
    const text = await response.text();
    
    // Simple logic to detect Google Sheets 'gviz' JSON format
    if (text.includes("google.visualization.Query.setResponse")) {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        const gvizData = JSON.parse(jsonStr);
        
        // Transform gviz format to our JiraItem[] format
        const rows = gvizData.table.rows;
        const cols = gvizData.table.cols.map((c: any) => c.label || c.id);
        
        return rows.map((row: any) => {
            const item: Record<string, any> = {};
            row.c.forEach((cell: any, i: number) => {
                const colName = cols[i];
                item[colName] = cell ? cell.v : null;
            });
            return item as JiraItem;
        });
    }

    // Standard JSON
    return JSON.parse(text) as JiraItem[];
  } catch (error) {
    console.error("Error fetching cloud data:", error);
    throw error;
  }
};
