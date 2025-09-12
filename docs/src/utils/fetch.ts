export const getPage = async <T>(id: string): Promise<T> => {
  const response = await fetch(`/${id}.json`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch entry '${id}': ${response.status} ${response.statusText} - ${errorText}`);
  }
  const data: T = await response.json();

  return {
    ...data
  };
};