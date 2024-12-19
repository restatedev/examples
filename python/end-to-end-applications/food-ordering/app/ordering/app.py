import restate

from ordering.delivery_manager import delivery_manager
from ordering.driver_digital_twin import driver_digital_twin
from ordering.driver_matcher import driver_matcher
from ordering.external.driver_mobile_app_sim import mobile_app_object
from ordering.order_workflow import order_workflow
from ordering.order_status import order_status

app = restate.app([order_workflow, delivery_manager, driver_digital_twin, driver_matcher, mobile_app_object, order_status])