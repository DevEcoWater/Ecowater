"use client";

import type React from "react";
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { useGoogleMaps } from "@/providers/google-maps-provider";
import { Autocomplete } from "@react-google-maps/api";

export interface AddressAutocompleteProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  onPlaceSelect?: (place: {
    address: string;
    shortData: string;
    location: { lat: number; lng: number };
  }) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
}

const AddressAutocomplete = forwardRef<
  HTMLInputElement,
  AddressAutocompleteProps
>(
  (
    {
      onPlaceSelect,
      onChange,
      placeholder = "Ingrese una dirección",
      defaultValue,
      value,
      ...props
    },
    ref
  ) => {
    const { isLoaded } = useGoogleMaps();

    const handlePlaceChanged = (
      autocomplete: google.maps.places.Autocomplete
    ) => {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        const address = place.formatted_address || "";

        const routeComponent = place.address_components?.find((component) =>
          component.types.includes("route")
        );

        const shortData = routeComponent?.short_name || "";

        if (onPlaceSelect) {
          onPlaceSelect({ address, shortData, location });
        }

        if (onChange) {
          onChange(address);
        }
      }
    };

    if (!isLoaded) {
      return <Input ref={ref} placeholder={placeholder} disabled {...props} />;
    }

    return (
      <Autocomplete
        onLoad={(autocomplete) => {
          autocomplete.addListener("place_changed", () =>
            handlePlaceChanged(autocomplete)
          );
        }}
        onUnmount={(autocomplete) => {
          google.maps.event.clearInstanceListeners(autocomplete);
        }}
        types={["address"]}
      >
        <Input
          ref={ref}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          {...props}
        />
      </Autocomplete>
    );
  }
);

AddressAutocomplete.displayName = "AddressAutocomplete";

export default AddressAutocomplete;
