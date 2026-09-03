import { Autocomplete, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { set, StringInputProps, unset, useClient } from "sanity";

export function CategoryAutocomplete(props: StringInputProps) {
  const { value, onChange } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch unique categories already entered across treatments
    client
      .fetch<string[]>(
        `array::unique(*[_type == "treatment" && defined(category)].category)`,
      )
      .then((cats) => {
        setOptions(cats.filter(Boolean));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [client]);

  return (
    <Stack space={2}>
      <Autocomplete
        id={props.id}
        value={value || ""}
        loading={loading}
        placeholder="Type or select existing category..."
        options={options.map((cat) => ({ value: cat }))}
        onChange={(val) => onChange(val ? set(val) : unset())}
        openOnFocus
      />
      {options.length > 0 && (
        <Text muted size={1}>
          Existing: {options.slice(0, 6).join(", ")}
          {options.length > 6 ? "..." : ""}
        </Text>
      )}
    </Stack>
  );
}
