from rest_framework import permissions

class IsSuperuser(permissions.BasePermission):
    """
    Разрешение для суперпользователей.
    
    Доступ предоставляется:
    - Суперпользователям Django (is_superuser=True)
    - Пользователям с ролью 'superuser' в профиле
    
    Эти пользователи имеют полный доступ ко всем данным во всех компаниях.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            hasattr(request.user, 'userprofile') and request.user.userprofile.user_group == 'superuser'
        )

class IsCompanyAdmin(permissions.BasePermission):
    """
    Разрешение для администраторов компаний.
    
    Доступ предоставляется:
    - Пользователям с ролью 'admin' в профиле
    
    Администраторы имеют полный доступ к данным своей компании,
    но не могут видеть или изменять данные других компаний.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            hasattr(request.user, 'userprofile') and request.user.userprofile.user_group == 'admin'
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        # Проверяем, принадлежит ли объект компании пользователя
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем компанию пользователя
        user_company = request.user.userprofile.company
        
        # Проверяем, есть ли у объекта атрибут 'company'
        if hasattr(obj, 'company'):
            return obj.company == user_company
        
        # Если объект - это пользователь, проверяем его компанию
        if hasattr(obj, 'userprofile') and hasattr(obj.userprofile, 'company'):
            return obj.userprofile.company == user_company
        
        return False

class IsCompanyBoss(permissions.BasePermission):
    """
    Разрешение для руководителей компаний.
    
    Доступ предоставляется:
    - Пользователям с ролью 'admin' или 'boss' в профиле
    
    Руководители имеют расширенные права доступа к данным своей компании,
    включая управление финансами и аналитику.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            hasattr(request.user, 'userprofile') and 
            request.user.userprofile.user_group in ['admin', 'boss']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        # Проверяем, принадлежит ли объект компании пользователя
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем компанию пользователя
        user_company = request.user.userprofile.company
        
        # Проверяем, есть ли у объекта атрибут 'company'
        if hasattr(obj, 'company'):
            return obj.company == user_company
        
        # Если объект - это пользователь, проверяем его компанию
        if hasattr(obj, 'userprofile') and hasattr(obj.userprofile, 'company'):
            return obj.userprofile.company == user_company
        
        return False

class IsCompanyManager(permissions.BasePermission):
    """
    Разрешение для менеджеров компаний.
    
    Доступ предоставляется:
    - Пользователям с ролью 'admin', 'boss' или 'manager' в профиле
    
    Менеджеры имеют права на выполнение большинства операций с заявками и отправками,
    но ограничены в доступе к финансовым и аналитическим данным.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            hasattr(request.user, 'userprofile') and 
            request.user.userprofile.user_group in ['admin', 'boss', 'manager']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        # Проверяем, принадлежит ли объект компании пользователя
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем компанию пользователя
        user_company = request.user.userprofile.company
        
        # Проверяем, есть ли у объекта атрибут 'company'
        if hasattr(obj, 'company'):
            return obj.company == user_company
        
        # Если объект - это пользователь, проверяем его компанию
        if hasattr(obj, 'userprofile') and hasattr(obj.userprofile, 'company'):
            return obj.userprofile.company == user_company
        
        return False

class IsCompanyWarehouse(permissions.BasePermission):
    """
    Разрешение для сотрудников склада компаний.
    
    Доступ предоставляется:
    - Пользователям с ролью 'admin', 'boss', 'manager' или 'warehouse' в профиле
    
    Сотрудники склада имеют права на работу с заявками и отправками на складе,
    но ограничены в доступе к другим данным.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            hasattr(request.user, 'userprofile') and 
            request.user.userprofile.user_group in ['admin', 'boss', 'manager', 'warehouse']
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        # Проверяем, принадлежит ли объект компании пользователя
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем компанию пользователя
        user_company = request.user.userprofile.company
        
        # Проверяем, есть ли у объекта атрибут 'company'
        if hasattr(obj, 'company'):
            return obj.company == user_company
        
        # Если объект - это пользователь, проверяем его компанию
        if hasattr(obj, 'userprofile') and hasattr(obj.userprofile, 'company'):
            return obj.userprofile.company == user_company
        
        return False

class IsCompanyClient(permissions.BasePermission):
    """
    Разрешение для клиентов компаний (ограниченный доступ).
    
    Доступ предоставляется:
    - Пользователям с ролью 'client' в профиле
    
    Клиенты имеют сильно ограниченный доступ - только к своим заявкам,
    связанным с ними отправкам и финансовым операциям.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            hasattr(request.user, 'userprofile') and 
            request.user.userprofile.user_group == 'client'
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, имеет ли клиент доступ к объекту.
        Клиенты имеют доступ только к своим заявкам и связанным с ними данным.
        """
        # Клиенты имеют доступ только к своим отправлениям, заявкам и финансам
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем профиль пользователя
        user_profile = request.user.userprofile
        
        # Проверяем, есть ли у объекта атрибут 'client'
        if hasattr(obj, 'client'):
            return obj.client == user_profile
        
        # Проверяем, есть ли у объекта связь с клиентом через заявку
        if hasattr(obj, 'request') and hasattr(obj.request, 'client'):
            return obj.request.client == user_profile
        
        # Проверяем, есть ли у объекта связь с клиентом через отправление и заявку
        if hasattr(obj, 'shipment') and obj.shipment:
            # Получаем все заявки этого отправления
            requests = obj.shipment.request_set.all()
            # Проверяем, есть ли среди них заявки этого клиента
            return requests.filter(client=user_profile).exists()
        
        return False

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешение, позволяющее редактировать объект только его владельцу.
    
    Доступ на чтение предоставляется всем аутентифицированным пользователям,
    но изменять объект может только его владелец.
    """
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь владельцем объекта.
        """
        # Для чтения разрешено всем
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Проверяем атрибуты владельца
        if hasattr(obj, 'created_by'):
            return obj.created_by == getattr(request.user, 'userprofile', None)
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'client') and hasattr(request.user, 'userprofile'):
            return obj.client == request.user.userprofile
        
        if hasattr(obj, 'uploaded_by') and hasattr(request.user, 'userprofile'):
            return obj.uploaded_by == request.user.userprofile
        
        return False

class IsCompanyMember(permissions.BasePermission):
    """
    Разрешение для всех сотрудников компании (включая клиентов).
    
    Доступ предоставляется:
    - Всем пользователям, у которых есть профиль и компания
    
    Это базовое разрешение, которое проверяет принадлежность к компании,
    но не учитывает конкретную роль пользователя.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'userprofile')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        # Проверяем, принадлежит ли объект компании пользователя
        if not hasattr(request.user, 'userprofile'):
            return False
        
        # Получаем компанию пользователя
        user_company = request.user.userprofile.company
        
        # Если у пользователя нет компании, разрешаем доступ только к его собственным объектам
        if not user_company:
            if hasattr(obj, 'user'):
                return obj.user == request.user
            if hasattr(obj, 'client') and hasattr(request.user, 'userprofile'):
                return obj.client == request.user.userprofile
            return False
        
        # Проверяем, есть ли у объекта атрибут 'company'
        if hasattr(obj, 'company'):
            return obj.company == user_company
        
        # Если объект - это пользователь, проверяем его компанию
        if hasattr(obj, 'userprofile') and hasattr(obj.userprofile, 'company'):
            return obj.userprofile.company == user_company
        
        return False 