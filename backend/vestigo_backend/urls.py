from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.contrib import admin

schema_view = get_schema_view(
   openapi.Info(
      title="Vestigo CRM API",
      default_version='v1',
      description="API documentation for Vestigo CRM",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@vestigo.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('users.urls')),
    path('api/v1/bdm/', include('bdm.urls')),
    path('api/v1/operations/', include('operations.urls')),
    path('api/v1/claims/', include('claims.urls')),
    path('api/v1/underwriting/', include('underwriting.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/reconciliation/', include('reconciliation.urls')),
    path('api/v1/reports/', include('reports.urls')),

    # Swagger
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
