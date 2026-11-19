from decimal import Decimal
from edition import PROVINCES, source, elements, txt, coordinates, save
URL='https://map-carte.tbs-sct.gc.ca/fcsi-rscf/oddo/fcsi-rscf.zip'
CATALOG='https://open.canada.ca/data/en/dataset/1d42f7b9-1549-40aa-8ac6-0e0302ff2902'
SPENDING=['TotalAssessmentExpenditure','TotalRemediationExpenditure','TotalCareMaintenanceExpenditure','TotalMonitoringExpenditure']
def cents(value):
    return int(Decimal(value)*100) if value else None
def records(raw):
    orgs={}
    for e in elements(raw,{'ReportingOrganization','Site'}):
        if e.tag=='ReportingOrganization':
            orgs[txt(e,'Code')]=txt(e,'EN');continue
        province=txt(e,'Location/Province')
        if province not in PROVINCES:continue
        years=[]
        for a in e.findall('AnnualData'):
            years.append([a.get('FiscalYear'),txt(a,'HighestStepCompleted'),*[cents(txt(a,k)) for k in SPENDING],a.get('ReportingOrganization')])
        pairs=[[txt(m,'Contamination/EN'),txt(m,'Medium/EN')] for m in e.findall('ContaminationDetails/ContaminatedMedia')]
        code=e.get('ReportingOrganization')
        yield {'group':PROVINCES[province],'id':e.attrib['FederalSiteIdentifier'],'title':txt(e,'Name/EN') or 'Unnamed site',
               'place':txt(e,'Location/Municipality'),'province':province,'kind':txt(e,'Classification/Name/EN'),
               'status':txt(e,'SiteStatus/Status/EN'),'owner':orgs.get(code,code),'geo':coordinates(txt(e,'Location/Latitude'),txt(e,'Location/Longitude')),
               'description':txt(e,'SiteStatus/Description/EN'),'strategy':[a.text for a in e.findall('ManagementStrategy/ManagementType/EN') if a.text],
               'media':pairs,'years':sorted(years, key=lambda r:r[0] or '',reverse=True),'property':txt(e,'PropertyNumber'),'updated':e.get('LastModified','')[:10]}
if __name__=='__main__':
    rows=list(records(source(URL,'fcsi.zip')))
    if set(r['group'] for r in rows)!=set(PROVINCES.values()) or len(rows)<3500:raise ValueError('Unexpected regional coverage')
    years=sorted(y[0] for r in rows for y in r['years'] if y[0])
    save(rows,[{'name':'Federal Contaminated Sites Inventory','url':CATALOG,'download':URL}],{'firstFiscal':years[0],'lastFiscal':years[-1]})
