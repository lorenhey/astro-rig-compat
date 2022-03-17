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

if __name__ == "__main__":
    app()
