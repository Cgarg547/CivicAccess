# Billy Bishop Airport pedestrian tunnel — network limitation

## Evidence

The Billy Bishop Toronto City Airport Interactive Map (2022),
stored at:

data/raw/Billy-Bishop-Airport-Interactive-Map-2022.pdf

depicts a pedestrian tunnel between the mainland passenger-transfer
pavilion and the island airport terminal.

The map is schematic and does not provide georeferenced entrance
coordinates or establish unrestricted access to the Toronto Islands
public pedestrian network.

## Pedestrian network findings

The Toronto pedestrian network source contains six connected components.

The second-largest component has 275 nodes and includes 12 candidate
washroom sites.

The closest identified nodes between the two largest components are
approximately 203.19 metres apart in a straight line.

Mainland candidate:
- OBJECTID 13517
- Road type: Trail
- Sidewalk classification: Not applicable

Disconnected component candidate:
- OBJECTID 1653
- Road type: Access Road
- Sidewalk classification: No sidewalk on either side

The 203.19-metre separation is not a measured pedestrian route.

## Modeling decision

Do not insert a hypothetical tunnel edge into the production graph.

Preserve the disconnected components in the published analysis until
the tunnel entrance coordinates, permitted pedestrian connections,
and access conditions are verified.

The existing network coverage estimates are model-based and should
not be interpreted as proof that these locations are physically
inaccessible.

## Proximity audit

The local `data/processed/tunnel_network_proximity.csv` diagnostic
contains 135 nearby network-feature records: 94 for the mainland
anchor and 41 for the island anchor.

The closest mainland feature is OBJECTID 13517, classified as a
Trail, with sidewalk classification "Not applicable". The closest
island feature is OBJECTID 1653, classified as an Access Road,
with "No sidewalk on either side".

Both reported anchor-to-feature distances are 0.00 metres. These
measurements establish coincidence with mapped features at the
respective anchors; they do not establish a connection between the
components, a traversable tunnel, or permission to walk the route.

The CSV is a diagnostic artifact, not proof of tunnel connectivity.
Its generation procedure and source inputs should be retained if
the measurements are used in a formal reproducibility review.

## Future validation

1. Obtain authoritative georeferenced tunnel entrance locations.
2. Verify connections to permitted pedestrian routes on both sides.
3. Confirm public access conditions and operational restrictions.
4. Model the tunnel length and any additional transfer time.
5. Recompute all affected network and neighbourhood outputs.
6. Compare the revised results against the original baseline.
