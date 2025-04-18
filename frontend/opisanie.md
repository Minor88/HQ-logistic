👥 Роли пользователей и их интерфейсы

🔹 Суперпользователь:
Функции:
•	Может создавать/редактировать/удалять компании 
•	Суперпользователь у этих компаний может создавать/редактировать/удалять администраторов.
•	Может заходить в личный кабинет компании как администратор этой компании и как руководитель.

🔹 Администратор:
Функции:
•	Администратор привязан к личному кабинету компании. Может видеть сущности, делать какие-либо манипуляции только с данными, которые принадлежат компании.
•	Может создавать/редактировать/удалять руководителей, менеджеров, склад (пользователи с правами складского работника), клиентов. Эти пользователи привязаны к компании, и могут взаимодействовать с сущностями только этой компании.
•	Администратор может создавать/редактировать/удалять статьи расходов/доходов
🔹 Руководитель:
Функции:
•	Руководитель привязан к личному кабинету компании. Может видеть сущности, делать какие-либо манипуляции только с данными, которые принадлежат компании.
•	Создание, редактирование, удаление клиентов компании
•	Создание, редактирование, удаление заявок и отправлений
•	Работа с файлами и папками заявок и отправлений: загрузка, удаление, скачивание. Создание, редактирование, удаление папок и подпапок.
•	Полный доступ к модулю финансов, расчётов и аналитики. Создание, редактирование, удаление записей.
🔹 Менеджер:
Функции:
•	Менеджер привязан к личному кабинету компании. Может видеть сущности, делать какие-либо манипуляции только с данными, которые принадлежат компании.
•	Создание, редактирование, удаление заявок и отправлений
•	Работа с файлами и папками заявок и отправлений: загрузка, удаление, скачивание. Создание, редактирование, удаление папок и подпапок.

🔹 Склад:
Функции:
•	Пользователи группы склад привязаны к личному кабинету компании. Может видеть сущности, делать какие-либо манипуляции только с данными, которые принадлежат компании.
•	У отправлений могут менять только статус и комментарий
•	У заявок могут менять только статус и комментарий, редактировать поля фактический вес и фактический объём
•	Работа с файлами и папками заявок и отправлений: загрузка, скачивание. Создание, папок и подпапок.
🔹 Клиент:
Функции:
•	Клиенты привязаны к личному кабинету компании. Может видеть сущности, делать какие-либо манипуляции только с данными, которые принадлежат компании.
•	Отправления – могут видеть только те, в которых есть заявки где они указаны как клиент. Не могут создавать, редактировать, удалять
•	Заявки – видит только те, где они указаны как клиент. Может создавать (автоматически применяется в качестве клиента). Редактировать и удалять может только те заявки, в которых является клиентом и у которых статус “Новая заявка”.
•	Работа с файлами и папками заявок: загрузка, скачивание, удаление в которых является клиентом и у которых статус “Новая заявка”. Если статус иной, то может только загружать и скачивать.
•	Модуль финансов и расчётов. Видит только те записи, где указан как клиент.

Модули:
Отправления
1.	Должна быть таблица с колонками:
- Дата создания (функция фильтрации оп временному промежутку, функция сортировки)
- Номер (функция сортировки и поиска)
- Комментарий (функция поиска)
- Статус (функция фильтра по значениям)
- Файлы (в ячейке должна быть кнопка, при нажатии на которую всплывает окно взаимодействия с папками и файлами этого отправления)
- Действия (в ячейке должны быть кнопки редактировать, удалить, отправить уведомления)

2.	При нажатии редактировать в ячейке таблицы, редактирование должно происходить прямо в строке таблицы. Дату выбираем из календарика, статус выбираем из выпадающего списка с поиском.
3.	При нажатии удалить в ячейке таблицы, должно выводиться уточнение, точно ли мы хотим удалить запись.
4.	При нажатии отправить уведомления в ячейке таблицы, всем клиентам, заявки которых есть в этом отправлении должно отправиться письмо, в теме которого должен быть указан номер отправления, в теле письма статус и комментарий отправления.
5.	При нажатии на номер отправления в ячейке таблицы, нас должно перекинуть в заявки, где таблица заявок должна быть отфильтрована по номеру отправления.
6.	Должна быть кнопка очистки фильтров и сортировок таблицы. При нажатии видим таблицу в исходном виде.
7.	Должна быть кнопка создания нового отправления. При создании нового отправления, дату заполняем выбором из календаря, статус выбираем из выпадающего списка с поиском. Остальные поля заполняются вручную.
8.	Должна быть кнопка Экспорт в excel. Принцип действия следующий, если нажимаем, то выгружаем в excel таблицу. Причём, если у нас применены каки-либо фильтры, то выгружаем в excel только отфильтрованную часть таблицы.
9.	Таблица по умолчанию должна отображать отсортированные отправления от новой к старой.

Заявки
1.	Должна быть таблица с колонками:
- Дата создания (функция фильтрации оп временному промежутку, функция сортировки)
- Номер (функция сортировки и поиска)
- Складской № (функция поиска)
- Описание (функция поиска)
- Кол-во мест
- Вес (кг)
- Объем (м³)
- Фактический вес (кг)
- Фактический объем (м³)
- Комментарий (функция поиска)
- Ставка
- Клиент (функция фильтрации с поиском)
- Статус (функция фильтрации)
- Отправление (Номер отправления, при создании выбирается из выпадающего списка с поиском, функция фильтрации с поиском)
- Статус отправления (наследуется из отправлений по номеру, функция фильтрации)
- Комментарий отправления (наследуется из отправлений по номеру)
- Файлы (в ячейке должна быть кнопка, при нажатии на которую всплывает окно взаимодействия с папками и файлами этой заявки)
- Действия (в ячейке должны быть кнопки редактировать, удалить)

2.	Должна быть кнопка создания новой заявки. При создании новой заявки, дату заполняем выбором из календаря, статус выбираем из выпадающего списка с поиском, клиента выбираем из выпадающего списка с поиском, отправление выбираем из выпадающего списка с поиском, статус и комментарий отправления подтягиваются из отправления. Остальные поля заполняются вручную.
3.	Должна быть кнопка очистки фильтров и сортировок таблицы. При нажатии видим таблицу в исходном виде.
4.	Должна быть кнопка Экспорт в excel. Принцип действия следующий, если нажимаем, то выгружаем в excel таблицу. Причём, если у нас применены каки-либо фильтры, то выгружаем в excel только отфильтрованную часть таблицы.
5.	Таблица по умолчанию должна отображать отсортированные отправления от новой к старой.
6.	При нажатии редактировать в ячейке таблицы, редактирование должно происходить прямо в строке таблицы.
7.	При нажатии удалить в ячейке таблицы, должно выводиться уточнение, точно ли мы хотим удалить запись.

Финансы
Счета м оплаты
1.	Должна быть таблица с колонками:
- Дата создания (функция фильтрации оп временному промежутку, функция сортировки)
- Номер (функция сортировки и поиска)
- Тип операции (функция фильтра по значениям)
- Дата оплаты (функция фильтрации оп временному промежутку, функция сортировки)
- Тип документа (функция фильтра по значениям)
- Валюта (функция фильтра по значениям)
- Клиент (функция фильтрации с поиском)
- Статья (функция фильтрации с поиском)
- Сумма
- Комментарий (функция поиска)
- Отправление (Номер отправления, при создании выбирается из выпадающего списка с поиском, функция фильтрации с поиском)
- Заявка (Номер отправления, при создании выбирается из выпадающего списка с поиском, функция фильтрации с поиском)
- Основание (Номер отправления, при создании выбирается из выпадающего списка с поиском, функция фильтрации с поиском)
- Оплата (функция фильтра). В ячейках ставится или снимается галочка.
- Действия (в ячейке должны быть кнопки редактировать, удалить)

2.	Должна быть кнопка создания новой записи счёта или оплаты. При создании новой записи, дату создания заполняем выбором из календаря, дату оплаты заполняем выбором из календаря, Тип операции, Тип документа, валюту, Клиента, Статью, Отправление, Заявку , Основание выбираем из выпадающего списка с поиском, Остальные поля заполняются вручную.
3.	В Отправление, Заявка, Основание должна быть возможность выбора пустого значения
4.	Должна быть кнопка очистки фильтров и сортировок таблицы. При нажатии видим таблицу в исходном виде.
5.	Должна быть кнопка Экспорт в excel. Принцип действия следующий, если нажимаем, то выгружаем в excel таблицу. Причём, если у нас применены каки-либо фильтры, то выгружаем в excel только отфильтрованную часть таблицы.
6.	Таблица по умолчанию должна отображать отсортированные отправления от новой к старой.
7.	При нажатии удалить в ячейке таблицы, должно выводиться уточнение, точно ли мы хотим удалить запись.
Калькуляция отправления
1.	Должно быть выпадающее поле с поиском отправления.
2.	Должно быть поле ввода кура USD и поле ввода курса EUR с кнопкой сохранить. Курс будет привязываться к отправлению.
3.	При выборе отправления должны появляться две таблицы:
Заявки отправления, в которой будут отображаться заявки которые есть в этом отправлении с колонками:
-	Номер
-	Описание
-	Кол-во мест
-	Фактический вес (кг)
-	Фактический объем (м³)
-	Комментарий
-	Клиент
-	Расчётный вес
-	Себестоимость руб.

Затраты на отправление, в которую будут попадать все входящие счета по этому отправлению, с колонками:
-	Номер
-	Валюта 
-	Сумма
-	Клиент
-	Статья
-	Комментарий
4.	Должна быть кнопка Считать, которая рассчитает поля Расчётный вес и Себестоимость руб в таблице Заявки отправления
5.	Должна быть кнопка экспорт в Excel, которая выгрузит таблицу заявок с просчитанными значениями.

Баланс
1.	Должно быть поле выбора валюты. При выборе валюты должен показывать по ней баланс компании
Баланс контрагентов 
1.	Должно быть поле выбора Клиента. При выборе Клиента должен показывать баланс клиента по каждой валюте.

Статьи расходов и доходов.
Должен быть доступ у администраторов. Там должна быть форма создания, редактирования и удаления статей доходов и расходов
Статусы отправлений.
Должен быть доступ у администраторов. Там должна быть форма создания, редактирования и удаления статусов отправлений

Статусы заявок.
Должен быть доступ у администраторов. Там должна быть форма создания, редактирования и удаления статусов заявок.
