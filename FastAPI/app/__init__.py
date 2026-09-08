"""NCSpectra backend application package.

Importing the models subpackage here ensures all ORM classes are registered
on Base.metadata before database.init_db() calls create_all().
"""

# These imports must happen before init_db() is called.
# They register each table with SQLAlchemy's Base.metadata.
from app.models.officer import Officer  # noqa: F401
from app.models.reagent import Reagent  # noqa: F401
from app.models.seizure_record import SeizureRecord  # noqa: F401
from app.models.analysis_result import AnalysisResult  # noqa: F401
from app.models.notification import Notification  # noqa: F401
