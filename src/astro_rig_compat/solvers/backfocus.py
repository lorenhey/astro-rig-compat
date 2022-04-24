from typing import List, Tuple, Optional
import itertools
from astro_rig_compat.core.catalog import Catalog
from astro_rig_compat.utils.units import Distance, ureg

class SpacerSolver:
    def __init__(self, catalog: Catalog):
        self.catalog = catalog
        self.spacers = [c for c in catalog.components.values() if c.type == "spacer" and c.optical_length is not None]
        
    def solve(self, missing_distance: Distance, tolerance: Distance = 0.5 * ureg.mm, max_spacers: int = 4) -> List[List[str]]:
        """Find combinations of spacers that add up to missing_distance within tolerance."""
        solutions = []
        
        # Simple brute force for combinations up to max_spacers
        for k in range(1, max_spacers + 1):
            for combo in itertools.combinations_with_replacement(self.spacers, k):
                total_length = sum([c.optical_length.m for c in combo]) * ureg.mm
                delta = abs(total_length.m - missing_distance.m)
                
                if delta <= tolerance.m:
                    solutions.append([c.id for c in combo])
                    
        # Sort solutions by number of spacers (prefer fewer), then by delta
        solutions.sort(key=lambda s: len(s))
        return solutions
