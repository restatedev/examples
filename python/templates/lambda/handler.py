import restate

from greeter import greeter

app = restate.app(services=[greeter])
