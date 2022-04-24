import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.validation import ValidationEngine
from astro_rig_compat.engines.result import ValidationResult

app = typer.Typer(help="astro-rig-compat: Astronomical Rig Compatibility Engine")
console = Console()

def print_result_section(name: str, result: ValidationResult):
    color = "green"
    if result.state == "INCOMPATIBLE": color = "red"
    elif result.state == "UNKNOWN": color = "yellow"
    elif result.state == "COMPATIBLE WITH CONDITIONS": color = "magenta"
    elif result.state == "NOT EVALUABLE": color = "dim"
    
    console.print(f"[bold]{name.upper():<15}[/bold] [{color}]{result.state}[/{color}]")
    
    for msg in result.messages:
        msg_color = "red" if msg.severity == "error" else "yellow" if msg.severity == "warning" else "blue"
        console.print(f"  [{msg_color}]• {msg.message}[/{msg_color}]")
    if result.messages:
        console.print()

@app.command()
def check(rig_file: str):
    """Validate a rig configuration file."""
    try:
        rig = Rig.from_yaml(rig_file)
    except Exception as e:
        console.print(f"[red]Error loading rig file: {e}[/red]")
        raise typer.Exit(1)
        
    engine = ValidationEngine()
    result = engine.evaluate(rig)
    
    overall_color = "green"
    if result.state == "INCOMPATIBLE": overall_color = "red"
    elif result.state == "UNKNOWN": overall_color = "yellow"
    elif result.state == "COMPATIBLE WITH CONDITIONS": overall_color = "magenta"
    
    console.print(Panel.fit(f"Rig Validation: {rig.name} v{rig.version}", border_style="blue"))
    
    print_result_section("Mechanical", result.mechanical)
    print_result_section("Optical", result.optical)
    print_result_section("Mounting", result.mounting)
    print_result_section("Power", result.power)
    print_result_section("Data", result.data)
    print_result_section("Software", result.software)
    print_result_section("Geometry", result.geometry)
    
    console.print(f"[bold]OVERALL STATE:[/bold] [{overall_color}]{result.state}[/{overall_color}]")
    
    if result.state == "INCOMPATIBLE":
        raise typer.Exit(1)

@app.command()
def unknowns(rig_file: str):
    """List missing data in the rig that might affect evaluation."""
    rig = Rig.from_yaml(rig_file)
    console.print(Panel.fit(f"Unknowns for {rig.name}", border_style="yellow"))
    
    for c_id, comp in rig.components.items():
        missing = []
        if comp.mass is None and comp.type != "mount": missing.append("mass")
        if comp.optical_length is None and comp.type not in ("telescope", "camera", "mount", "power_supply", "usb_hub", "controller"):
            missing.append("optical_length")
        
        for p_id, p in comp.mechanical_ports.items():
            if p.interface_family == "metric_thread":
                if p.nominal_size is None: missing.append(f"port {p_id} thread nominal_size")
                if p.pitch is None: missing.append(f"port {p_id} thread pitch")
                if p.gender is None: missing.append(f"port {p_id} thread gender")
            if p.clear_aperture is None: missing.append(f"port {p_id} clear_aperture")
            
        for p_id, p in comp.electrical_ports.items():
            if p.port_type == "power_in" and p.current is None: missing.append(f"port {p_id} continuous current")
            if p.port_type == "power_in" and p.peak_current is None: missing.append(f"port {p_id} peak current")
            
        if missing:
            console.print(f"[bold]{c_id}[/bold] ({comp.type})")
            for m in missing:
                console.print(f"  [yellow]- {m}[/yellow]")
    console.print()

from astro_rig_compat.core.catalog import Catalog
from astro_rig_compat.solvers.backfocus import SpacerSolver
from astro_rig_compat.utils.units import ureg

@app.command()
def backfocus(missing_mm: float, tolerance_mm: float = 0.5, catalog_dir: str = "catalog"):
    """Find spacers in the catalog to fill a missing backfocus distance."""
    cat = Catalog()
    cat.load_from_dir(catalog_dir)
    
    solver = SpacerSolver(cat)
    missing = missing_mm * ureg.mm
    tol = tolerance_mm * ureg.mm
    
    solutions = solver.solve(missing, tol)
    
    console.print(Panel.fit(f"Backfocus Solver: need {missing_mm} mm (±{tolerance_mm} mm)", border_style="blue"))
    
    if not solutions:
        console.print("[red]No spacer combinations found.[/red]")
        return
        
    for idx, sol in enumerate(solutions[:10]): # Limit to top 10
        total_len = sum([cat.components[sid].optical_length.m for sid in sol])
        console.print(f"[bold]Option {idx+1}:[/bold] {total_len:.2f} mm")
        for sid in sol:
            comp = cat.components[sid]
            console.print(f"  - {comp.metadata.model} ({comp.optical_length})")
        console.print()

from astro_rig_compat.solvers.adapters import AdapterSolver
from astro_rig_compat.core.ports import MechanicalPort

@app.command()
def adapters(from_family: str, from_size: str, from_pitch: str, from_gender: str, 
             to_family: str, to_size: str, to_pitch: str, to_gender: str, catalog_dir: str = "catalog"):
    """Find a chain of adapters to connect two mechanical ports."""
    cat = Catalog()
    cat.load_from_dir(catalog_dir)
    
    solver = AdapterSolver(cat)
    
    p_from = MechanicalPort(interface_family=from_family, nominal_size=from_size, pitch=from_pitch, gender=from_gender, direction="output")
    p_to = MechanicalPort(interface_family=to_family, nominal_size=to_size, pitch=to_pitch, gender=to_gender, direction="input")
    
    chain = solver.find_adapters(p_from, p_to)
    
    console.print(Panel.fit("Adapter Solver", border_style="green"))
    
    if chain is None:
        console.print("[red]No adapter chain found.[/red]")
    elif len(chain) == 0:
        console.print("[green]Ports can connect directly! No adapters needed.[/green]")
    else:
        console.print("[bold]Adapter Chain:[/bold]")
        for c in chain:
            comp = cat.components[c]
            console.print(f"  - {comp.metadata.model} ({c})")

if __name__ == "__main__":
    app()
