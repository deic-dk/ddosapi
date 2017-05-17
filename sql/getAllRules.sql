select distinct *
from flow.flowspecrules
where coalesce(srcordestport,'') = coalesce(destinationport,'')
order by validto desc