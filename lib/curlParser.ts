export interface FetchRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export function parseCurl(curlCommand: string, envVariables: Record<string, string>): FetchRequest {
  // Replace environment variables in the curl command
  let processedCurl = curlCommand;
  for (const [key, value] of Object.entries(envVariables)) {
    const regex = new RegExp(`\\$${key}\\b|\\$\\{${key}\\}`, 'g');
    processedCurl = processedCurl.replace(regex, value);
  }

  try {
    const fetchRequest: FetchRequest = {
      url: '',
      method: 'GET',
      headers: {},
    };

    // Extract URL - look for the URL after curl command
    // Pattern: curl [options] URL or curl URL [options] or curl --url URL
    const urlPatterns = [
      // --url flag: curl --url https://...
      /(?:--url)\s+['"]?([https?:\/\/][^\s'"]+)/,
      // URL after method: curl -X POST https://...
      /(?:-X|--request)\s+\w+\s+['"]?([https?:\/\/][^\s'"]+)/,
      // URL directly after curl: curl https://...
      /curl\s+['"]?([https?:\/\/][^\s'"\\]+)/,
    ];

    for (const pattern of urlPatterns) {
      const urlMatch = processedCurl.match(pattern);
      if (urlMatch && urlMatch[1]) {
        fetchRequest.url = urlMatch[1].replace(/['"]$/, '').trim();
        break;
      }
    }

    if (!fetchRequest.url) {
      throw new Error('Could not extract URL from curl command');
    }

    // Extract method
    const methodMatch = processedCurl.match(/(?:-X|--request)\s+([A-Z]+)/);
    if (methodMatch) {
      fetchRequest.method = methodMatch[1];
    }

    // Extract headers - multiple patterns for different quote styles
    const headerPatterns = [
      /-H\s+'([^:]+):\s*([^']+)'/g,
      /-H\s+"([^:]+):\s*([^"]+)"/g,
      /--header\s+'([^:]+):\s*([^']+)'/g,
      /--header\s+"([^:]+):\s*([^"]+)"/g,
    ];

    for (const pattern of headerPatterns) {
      let match;
      while ((match = pattern.exec(processedCurl)) !== null) {
        fetchRequest.headers[match[1].trim()] = match[2].trim();
      }
    }

    // Extract body data
    const dataPatterns = [
      /(?:-d|--data|--data-raw)\s+'([^']+)'/s,
      /(?:-d|--data|--data-raw)\s+"([^"]+)"/s,
      /(?:-d|--data|--data-raw)\s+([^\s]+)/s,
    ];

    for (const pattern of dataPatterns) {
      const dataMatch = processedCurl.match(pattern);
      if (dataMatch) {
        fetchRequest.body = dataMatch[1];
        break;
      }
    }

    return fetchRequest;
  } catch (error) {
    throw new Error('Failed to parse curl command: ' + (error as Error).message);
  }
}

export function extractVariables(curlCommand: string): string[] {
  const variablePattern = /\$([A-Z_][A-Z0-9_]*)/g;
  const matches = curlCommand.matchAll(variablePattern);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

export function separatePublicPrivate(fetchRequest: FetchRequest, curlCommand: string) {
  const publicParams: { headers?: Record<string, string>; body?: any } = {};
  const privateParams: { headers?: Record<string, string>; body?: any } = {};

  // Separate headers
  const publicHeaders: Record<string, string> = {};
  const privateHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(fetchRequest.headers)) {
    // Check if the original curl had a variable in this header
    // Escape special regex characters in the header key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const headerPatterns = [
      new RegExp(`(?:-H|--header)\\s+['"]${escapedKey}:\\s*([^'"]+)['"]`, 'i'),
      new RegExp(`(?:-H|--header)\\s+"${escapedKey}:\\s*([^"]+)"`, 'i'),
      new RegExp(`(?:-H|--header)\\s+'${escapedKey}:\\s*([^']+)'`, 'i'),
    ];

    let hasVariable = false;
    for (const pattern of headerPatterns) {
      const match = curlCommand.match(pattern);
      if (match && match[1].includes('$')) {
        hasVariable = true;
        break;
      }
    }

    if (hasVariable) {
      privateHeaders[key] = value;
    } else {
      publicHeaders[key] = value;
    }
  }

  if (Object.keys(publicHeaders).length > 0) {
    publicParams.headers = publicHeaders;
  }
  if (Object.keys(privateHeaders).length > 0) {
    privateParams.headers = privateHeaders;
  }

  // Separate body
  if (fetchRequest.body) {
    const bodyMatch = curlCommand.match(/(?:-d|--data|--data-raw)\s+['"](.+?)['"]/s);
    if (bodyMatch && bodyMatch[1].includes('$')) {
      // Body has variables, treat as private
      try {
        privateParams.body = JSON.parse(fetchRequest.body);
      } catch {
        privateParams.body = fetchRequest.body;
      }
    } else {
      // Body has no variables, treat as public
      try {
        publicParams.body = JSON.parse(fetchRequest.body);
      } catch {
        publicParams.body = fetchRequest.body;
      }
    }
  }

  return { publicParams, privateParams };
}
