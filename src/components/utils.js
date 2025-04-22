import {useControl} from "react-map-gl";
import {MapboxOverlay} from "@deck.gl/mapbox";

export function DeckGLOverlay({ layers, interleaved }) {
    const overlay = useControl(
        () => new MapboxOverlay({ layers, interleaved })
    );
    overlay.setProps({ layers, interleaved });
    return null;
}
