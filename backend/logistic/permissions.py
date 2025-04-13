from rest_framework import permissions
from .models import ShipmentStatus

# Функция для проверки иерархии ролей
def check_role_hierarchy(user, required_role):
    """
    Проверяет, имеет ли пользователь роль равную или выше требуемой в иерархии.
    
    Иерархия ролей (от высшей к низшей):
    1. superuser
    2. admin
    3. boss
    4. manager
    5. warehouse
    6. client
    """
    if not user.is_authenticated or not hasattr(user, 'userprofile'):
        return False
        
    # Суперюзеры Django всегда имеют все права
    if user.is_superuser:
        return True
        
    user_role = user.userprofile.user_group
    
    # Карта иерархии ролей (ключ роль имеет доступ ко всем ролям в значении)
    role_hierarchy = {
        'superuser': ['superuser', 'admin', 'boss', 'manager', 'warehouse', 'client'],
        'admin': ['admin', 'boss', 'manager', 'warehouse', 'client'],
        'boss': ['boss', 'manager', 'warehouse', 'client'],
        'manager': ['manager', 'warehouse', 'client'],
        'warehouse': ['warehouse', 'client'],
        'client': ['client']
    }
    
    # Если роль пользователя есть в иерархии и требуемая роль в списке доступных
    return user_role in role_hierarchy and required_role in role_hierarchy.get(user_role, [])

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
        
    def has_object_permission(self, request, view, obj):
        """
        Суперпользователи имеют доступ ко всем объектам.
        """
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            hasattr(request.user, 'userprofile') and request.user.userprofile.user_group == 'superuser'
        )

class IsCompanyAdmin(permissions.BasePermission):
    """
    Разрешение для администраторов компаний.
    
    Доступ предоставляется:
    - Суперпользователям
    - Пользователям с ролью 'admin' в профиле
    
    Администраторы имеют полный доступ к данным своей компании,
    но не могут видеть или изменять данные других компаний.
    """
    def has_permission(self, request, view):
        return check_role_hierarchy(request.user, 'admin')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        if not check_role_hierarchy(request.user, 'admin'):
            return False
            
        # Суперпользователи имеют доступ ко всем объектам
        if request.user.is_superuser or (hasattr(request.user, 'userprofile') and 
                                         request.user.userprofile.user_group == 'superuser'):
            return True
            
        # Администраторы имеют доступ только к объектам своей компании
        if isinstance(obj, ShipmentStatus):
            return obj.company == request.user.userprofile.company
        return obj.company == request.user.userprofile.company

class IsCompanyBoss(permissions.BasePermission):
    """
    Разрешение для руководителей компаний.
    
    Доступ предоставляется:
    - Суперпользователям
    - Администраторам компаний
    - Пользователям с ролью 'boss' в профиле
    
    Руководители имеют расширенные права доступа к данным своей компании,
    включая управление финансами и аналитику.
    """
    def has_permission(self, request, view):
        return check_role_hierarchy(request.user, 'boss')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        if not check_role_hierarchy(request.user, 'boss'):
            return False
            
        # Суперпользователи имеют доступ ко всем объектам
        if request.user.is_superuser or (hasattr(request.user, 'userprofile') and 
                                         request.user.userprofile.user_group == 'superuser'):
            return True
            
        # Администраторы и боссы имеют доступ только к объектам своей компании
        if isinstance(obj, ShipmentStatus):
            return obj.company == request.user.userprofile.company
        return obj.company == request.user.userprofile.company

class IsCompanyManager(permissions.BasePermission):
    """
    Разрешение для менеджеров компаний.
    
    Доступ предоставляется:
    - Суперпользователям
    - Администраторам компаний
    - Руководителям компаний
    - Пользователям с ролью 'manager' в профиле
    
    Менеджеры имеют права на выполнение большинства операций с заявками и отправками,
    но ограничены в доступе к финансовым и аналитическим данным.
    """
    def has_permission(self, request, view):
        return check_role_hierarchy(request.user, 'manager')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        if not check_role_hierarchy(request.user, 'manager'):
            return False
            
        # Суперпользователи имеют доступ ко всем объектам
        if request.user.is_superuser or (hasattr(request.user, 'userprofile') and 
                                         request.user.userprofile.user_group == 'superuser'):
            return True
            
        # Остальные имеют доступ только к объектам своей компании
        if isinstance(obj, ShipmentStatus):
            return obj.company == request.user.userprofile.company
        return obj.company == request.user.userprofile.company

class IsCompanyWarehouse(permissions.BasePermission):
    """
    Разрешение для сотрудников склада компаний.
    
    Доступ предоставляется:
    - Суперпользователям
    - Администраторам компаний
    - Руководителям компаний
    - Менеджерам компаний
    - Пользователям с ролью 'warehouse' в профиле
    
    Сотрудники склада имеют права на работу с заявками и отправками на складе,
    но ограничены в доступе к другим данным.
    """
    def has_permission(self, request, view):
        return check_role_hierarchy(request.user, 'warehouse')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, принадлежит ли объект компании пользователя.
        """
        if not check_role_hierarchy(request.user, 'warehouse'):
            return False
            
        # Суперпользователи имеют доступ ко всем объектам
        if request.user.is_superuser or (hasattr(request.user, 'userprofile') and 
                                         request.user.userprofile.user_group == 'superuser'):
            return True
            
        # Остальные имеют доступ только к объектам своей компании
        if isinstance(obj, ShipmentStatus):
            return obj.company == request.user.userprofile.company
        return obj.company == request.user.userprofile.company

class IsCompanyClient(permissions.BasePermission):
    """
    Разрешение для клиентов компаний (ограниченный доступ).
    
    Доступ предоставляется:
    - Суперпользователям
    - Администраторам компаний
    - Руководителям компаний
    - Менеджерам компаний
    - Сотрудникам склада
    - Пользователям с ролью 'client' в профиле
    
    Клиенты имеют сильно ограниченный доступ - только к своим заявкам,
    связанным с ними отправкам и финансовым операциям.
    """
    def has_permission(self, request, view):
        return check_role_hierarchy(request.user, 'client')
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, имеет ли клиент доступ к объекту.
        Клиенты имеют доступ только к своим заявкам и связанным с ними данным.
        """
        if not check_role_hierarchy(request.user, 'client'):
            return False
            
        # Суперпользователи имеют доступ ко всем объектам
        if request.user.is_superuser or (hasattr(request.user, 'userprofile') and 
                                         request.user.userprofile.user_group == 'superuser'):
            return True
            
        # Администраторы и другие роли выше клиента имеют доступ ко всем объектам компании
        if hasattr(request.user, 'userprofile') and request.user.userprofile.user_group != 'client':
            if isinstance(obj, ShipmentStatus):
                return obj.company == request.user.userprofile.company
            return obj.company == request.user.userprofile.company
            
        # Клиенты имеют доступ только к своим заявкам и связанным с ними данным
        if hasattr(obj, 'client') and hasattr(request.user, 'userprofile'):
            return obj.client == request.user.userprofile
            
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