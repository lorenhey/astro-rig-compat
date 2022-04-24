import networkx as nx
from typing import List, Optional
from astro_rig_compat.core.catalog import Catalog
from astro_rig_compat.core.ports import MechanicalPort
from astro_rig_compat.core.components import ComponentType

class AdapterSolver:
    def __init__(self, catalog: Catalog):
        self.catalog = catalog
        self.graph = self._build_graph()
        
    def _ports_match(self, p1: MechanicalPort, p2: MechanicalPort) -> bool:
        if p1.interface_family != p2.interface_family: return False
        if p1.interface_family == "metric_thread":
            if p1.nominal_size != p2.nominal_size: return False
            if p1.pitch != p2.pitch: return False
            if p1.gender == p2.gender: return False
        return True

    def _build_graph(self) -> nx.DiGraph:
        G = nx.DiGraph()
        
        # Add all ports from all adapters/spacers in catalog
        valid_types = ("adapter", "spacer")
        adapters = [c for c in self.catalog.components.values() if c.type in valid_types]
        
        # A node in the graph is a specific physical port specification (family, size, pitch, gender).
        # An edge is a component that connects two such ports.
        
        # To make it robust, we can just represent each adapter component as an edge
        # between its input port spec and its output port spec.
        # But wait, ports can be connected if they match.
        
        def port_spec(p: MechanicalPort) -> str:
            if p.interface_family == "metric_thread":
                return f"metric_{p.nominal_size}_{p.pitch}_{p.gender}"
            return f"{p.interface_family}_{p.nominal_size}_{p.gender}"
            
        def opposite_gender_spec(p: MechanicalPort) -> str:
            if p.interface_family == "metric_thread":
                opp = "male" if p.gender == "female" else "female"
                return f"metric_{p.nominal_size}_{p.pitch}_{opp}"
            opp = "male" if p.gender == "female" else "female"
            return f"{p.interface_family}_{p.nominal_size}_{opp}"

        for ad in adapters:
            # Assume 1 input, 1 output for simple adapters
            in_ports = [p for p in ad.mechanical_ports.values() if p.direction in ("input", "bidirectional")]
            out_ports = [p for p in ad.mechanical_ports.values() if p.direction in ("output", "bidirectional")]
            
            for ip in in_ports:
                for op in out_ports:
                    if ip == op and len(ad.mechanical_ports) > 1: continue
                    # To connect to this adapter's input, the previous component's output must match
                    # the OPPOSITE gender of this adapter's input.
                    # So the node represents the required output port of the previous component.
                    required_prev_out = opposite_gender_spec(ip)
                    # The output of this adapter is provided as op.
                    provided_out = port_spec(op)
                    
                    G.add_edge(required_prev_out, provided_out, component=ad.id, weight=1)
                    
        return G
        
    def find_adapters(self, from_port: MechanicalPort, to_port: MechanicalPort) -> Optional[List[str]]:
        def port_spec(p: MechanicalPort) -> str:
            if p.interface_family == "metric_thread":
                return f"metric_{p.nominal_size}_{p.pitch}_{p.gender}"
            return f"{p.interface_family}_{p.nominal_size}_{p.gender}"
            
        def opposite_gender_spec(p: MechanicalPort) -> str:
            if p.interface_family == "metric_thread":
                opp = "male" if p.gender == "female" else "female"
                return f"metric_{p.nominal_size}_{p.pitch}_{opp}"
            opp = "male" if p.gender == "female" else "female"
            return f"{p.interface_family}_{p.nominal_size}_{opp}"
            
        start_node = port_spec(from_port)
        # We need to end up at a port that can connect to `to_port`.
        # Meaning the final adapter's output must be the opposite of `to_port`.
        target_node = opposite_gender_spec(to_port)
        
        # If they match directly, no adapter needed
        if start_node == target_node:
            return []
            
        try:
            path = nx.shortest_path(self.graph, start_node, target_node, weight='weight')
            components = []
            for i in range(len(path) - 1):
                edge_data = self.graph.get_edge_data(path[i], path[i+1])
                components.append(edge_data['component'])
            return components
        except nx.NetworkXNoPath:
            return None
        except nx.NodeNotFound:
            return None
